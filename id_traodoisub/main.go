package main

import (
	"crypto/hmac"
	"crypto/rc4"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

type ChallengeG struct {
	N string `json:"n"`
	T int64  `json:"t"`
	S string `json:"s"`
}

type Challenge struct {
	G  ChallengeG `json:"g"`
	P  string     `json:"p"`
	C  []string   `json:"c"`
	Fp string     `json:"fp"`
	V  string     `json:"v"`
}

type LookupResponse struct {
	Success   interface{} `json:"success"`
	ID        string      `json:"id"`
	Link      string      `json:"link"`
	ShareType int         `json:"share_type"`
	Name      string      `json:"name"`
	Code      int         `json:"code"`
	PostID    string      `json:"post_id"`
	Error     string      `json:"error"`
	Countdown int         `json:"countdown"`
}

func fnv1a32(b []byte) uint32 {
	var h uint32 = 2166136261
	for _, x := range b {
		h ^= uint32(x)
		h *= 16777619
	}
	return h
}

func getFingerprint(ua string) []byte {
	b := make([]byte, 4)
	b[0] = 0 // webdriver flag = false
	seed := fmt.Sprintf("%s|vi,en-US;q=0.9|1920x1080|-420|8|Win32", ua)
	h := fnv1a32([]byte(seed))
	b[1] = byte((h >> 16) & 0xff)
	b[2] = byte((h >> 8) & 0xff)
	b[3] = byte(h & 0xff)
	if b[0] == 0 && b[1] == 0 && b[2] == 0 && b[3] == 0 {
		b[3] = 1
	}
	return b
}

func b64urlDecode(s string) []byte {
	clean := strings.TrimRight(s, "=")
	res, err := base64.RawURLEncoding.DecodeString(clean)
	if err != nil {
		panic(err)
	}
	return res
}

func b64urlEncode(b []byte) string {
	return base64.RawURLEncoding.EncodeToString(b)
}

func sha256Hash(b []byte) []byte {
	h := sha256.Sum256(b)
	return h[:]
}

func hmacSha256(key, msg []byte) []byte {
	if len(key) > 64 {
		key = sha256Hash(key)
	}
	mac := hmac.New(sha256.New, key)
	mac.Write(msg)
	return mac.Sum(nil)
}

func rc4Crypt(key, data []byte) []byte {
	c, err := rc4.NewCipher(key)
	if err != nil {
		panic(err)
	}
	out := make([]byte, len(data))
	c.XORKeyStream(out, data)
	return out
}

func u48be(n int64) []byte {
	b := make([]byte, 6)
	for i := 5; i >= 0; i-- {
		b[i] = byte(n & 0xff)
		n >>= 8
	}
	return b
}

type NativeFn func(args ...interface{}) interface{}

func runProgram(program []byte, consts [][]byte, args []interface{}, userAgent string) string {
	nativeFns := []NativeFn{
		func(a ...interface{}) interface{} { return b64urlDecode(a[0].(string)) },             // 0
		func(a ...interface{}) interface{} { return []byte(a[0].(string)) },                   // 1
		func(a ...interface{}) interface{} { return sha256Hash(a[0].([]byte)) },               // 2
		func(a ...interface{}) interface{} { return hmacSha256(a[0].([]byte), a[1].([]byte)) }, // 3
		func(a ...interface{}) interface{} { return rc4Crypt(a[0].([]byte), a[1].([]byte)) },   // 4
		func(a ...interface{}) interface{} {
			switch v := a[0].(type) {
			case int64:
				return u48be(v)
			case float64:
				return u48be(int64(v))
			case int:
				return u48be(int64(v))
			default:
				panic(fmt.Sprintf("unknown u48be type: %T", v))
			}
		}, // 5
		func(a ...interface{}) interface{} { return b64urlEncode(a[0].([]byte)) }, // 6
		func(a ...interface{}) interface{} { return time.Now().UnixMilli() },       // 7
		func(a ...interface{}) interface{} { return getFingerprint(userAgent) },    // 8
	}

	r := make(map[byte]interface{})
	pc := 0
	progLen := len(program)

	for pc < progLen {
		op := program[pc]
		pc++
		switch op {
		case 58: // OP_PUSH_ARG
			slot := program[pc]
			imm := program[pc+1]
			pc += 2
			r[slot] = args[imm]
		case 17: // OP_PUSH_CONST
			slot := program[pc]
			imm := program[pc+1]
			pc += 2
			r[slot] = consts[imm]
		case 126: // OP_CALL
			slot := program[pc]
			fnIdx := program[pc+1]
			argc := int(program[pc+2])
			pc += 3
			callArgs := make([]interface{}, argc)
			for i := 0; i < argc; i++ {
				callArgs[i] = r[program[pc+i]]
			}
			pc += argc
			r[slot] = nativeFns[fnIdx](callArgs...)
		case 82: // OP_CONCAT
			slot := program[pc]
			argc := int(program[pc+1])
			pc += 2
			var totalLen int
			parts := make([][]byte, argc)
			for i := 0; i < argc; i++ {
				parts[i] = r[program[pc+i]].([]byte)
				totalLen += len(parts[i])
			}
			pc += argc
			out := make([]byte, totalLen)
			var offset int
			for _, p := range parts {
				copy(out[offset:], p)
				offset += len(p)
			}
			r[slot] = out
		case 195: // OP_SLICE
			slot := program[pc]
			src := program[pc+1]
			start := int(program[pc+2])
			end := int(program[pc+3])
			pc += 4
			data := r[src].([]byte)
			r[slot] = data[start:end]
		case 240: // OP_RETURN
			slot := program[pc]
			pc++
			return r[slot].(string)
		default:
			panic(fmt.Sprintf("unknown opcode: %d", op))
		}
	}
	panic("unexpected end of program")
}

func SignGanly(ch Challenge, link string, ua string) string {
	program := b64urlDecode(ch.P)
	consts := make([][]byte, len(ch.C))
	for i, c := range ch.C {
		consts[i] = b64urlDecode(c)
	}
	args := []interface{}{ch.G.N, ch.G.S, ch.G.T, link}
	return runProgram(program, consts, args, ua)
}

const (
	API_URL    = "https://id.traodoisub.com/api.php"
	DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
)

func FetchChallenge(client *http.Client) (*Challenge, error) {
	data := url.Values{}
	data.Set("m", "c")

	req, err := http.NewRequest("POST", API_URL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("content-type", "application/x-www-form-urlencoded")
	req.Header.Set("origin", "https://id.traodoisub.com")
	req.Header.Set("referer", "https://id.traodoisub.com/")
	req.Header.Set("user-agent", DEFAULT_UA)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var ch Challenge
	if err := json.Unmarshal(body, &ch); err != nil {
		return nil, fmt.Errorf("decode challenge fail: %w, raw: %s", err, string(body))
	}
	return &ch, nil
}

func LookupFacebookID(client *http.Client, link string) (*LookupResponse, error) {
	ch, err := FetchChallenge(client)
	if err != nil {
		return nil, fmt.Errorf("fetch challenge error: %w", err)
	}

	proof := SignGanly(*ch, link, DEFAULT_UA)

	data := url.Values{}
	data.Set("link", link)
	data.Set("sid", ch.G.N)

	req, err := http.NewRequest("POST", API_URL, strings.NewReader(data.Encode()))
	if err != nil {
		return nil, err
	}
	req.Header.Set("content-type", "application/x-www-form-urlencoded")
	req.Header.Set("origin", "https://id.traodoisub.com")
	req.Header.Set("referer", "https://id.traodoisub.com/")
	req.Header.Set("user-agent", DEFAULT_UA)
	req.Header.Set("x-ganly", proof)

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var res LookupResponse
	if err := json.Unmarshal(body, &res); err != nil {
		return nil, fmt.Errorf("decode response error: %w, raw: %s", err, string(body))
	}
	return &res, nil
}

func main() {
	targetLink := "https://www.facebook.com/groups/1528487012172019/permalink/1684774203209965/"
	if len(os.Args) > 1 && os.Args[1] != "" {
		targetLink = os.Args[1]
	}

	fmt.Println("==================================================")
	fmt.Println("  TraoDoiSub X-Ganly Proof Signer & Client (Go)")
	fmt.Println("==================================================")
	fmt.Printf("[*] Target link: %s\n", targetLink)

	client := &http.Client{Timeout: 15 * time.Second}

	fmt.Println("[*] Fetching challenge & solving VM bytecode...")
	startTime := time.Now()
	res, err := LookupFacebookID(client, targetLink)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[-] Error: %v\n", err)
		os.Exit(1)
	}
	elapsed := time.Since(startTime)

	fmt.Printf("[+] Solved & retrieved in: %v\n", elapsed)
	out, _ := json.MarshalIndent(res, "", "  ")
	fmt.Printf("[+] Result:\n%s\n", string(out))
}
