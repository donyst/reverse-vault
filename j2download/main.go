package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"regexp"
	"strings"
	"time"
)

const (
	BASE_URL       = "https://j2download.com"
	DEFAULT_UA     = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/155.0.0.0 Safari/537.36"
	DEFAULT_COOKIE = "session=ae10e86b116b2b24d1d8e1e933ea6bfe; cf_clearance=tCevVOubBdxttSFJaaMuXnrBBqXq6UQBx7WQJ2IS6XE-1792266100-1.2.1.1-XZYgwvKVXx4IL6Os2VwzVKdBjUOdm3L44Uurg072Y0eOq6hBZqkkmsJ2OaFMF2QODFOV6u_CG3xBFfZ0zvTK1KslQcajgayPkEajSbUF0oDeGUCpXhnaaWmFP9TzEVzIBUYzalPrRZdomlG00lZbUp2sQpxLkGo8LvpFUNRJUojFCACMzQ7QI_wwSCcZot5N2whzZ52tARdqhQ6PJfVJTyvOTW_zNAoGDkmBTLtCfNqjGdHp1g4ReXG.trLjWkciWWK7bUn58Q2q6BEmw3m.W14ziE1XDW_qJcJ8zm5ZVFxGhDHKmearkbIAArTz.a9GAnxPAhOZxxQ7h07qLf310JDeZ.O631iAg62oVE8I9R900o0jXAG8iwNdtZb0lFDj3v1WvyFfs4VfWp_aMdNC5HbNDd33_w1_iYmiKorSMIG6Q4CXei7.rPwcdDNpu4wPH0Mks7U20cUp_k2eKq5WKg"
)

type IssueResponse struct {
	OK            bool   `json:"ok"`
	AccessToken   string `json:"accessToken"`
	Error         string `json:"error"`
	Nonce         string `json:"nonce"`
	PowChallenge  string `json:"powChallenge"`
	ChallengeType string `json:"challengeType"`
	PowDifficulty int    `json:"powDifficulty"`
}

type AutolinkRequest struct {
	Data AutolinkData `json:"data"`
}

type AutolinkData struct {
	URL    string `json:"url"`
	Unlock bool   `json:"unlock"`
}

type J2Client struct {
	HTTPClient *http.Client
	Cookie     string
	UserAgent  string
}

func NewJ2Client(cookie string) *J2Client {
	if cookie == "" {
		cookie = DEFAULT_COOKIE
	}
	return &J2Client{
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		Cookie:     cookie,
		UserAgent:  DEFAULT_UA,
	}
}

func (c *J2Client) mergeCookies(setCookies []string) {
	for _, sc := range setCookies {
		parts := strings.Split(sc, ";")
		if len(parts) > 0 {
			cookiePart := strings.TrimSpace(parts[0])
			if kv := strings.SplitN(cookiePart, "=", 2); len(kv) == 2 {
				name := strings.TrimSpace(kv[0])
				val := strings.TrimSpace(kv[1])
				if strings.Contains(c.Cookie, name+"=") {
					re := regexp.MustCompile(name + `=[^;]+`)
					c.Cookie = re.ReplaceAllString(c.Cookie, name+"="+val)
				} else {
					if c.Cookie != "" && !strings.HasSuffix(c.Cookie, ";") {
						c.Cookie += "; "
					}
					c.Cookie += name + "=" + val
				}
			}
		}
	}
}

func (c *J2Client) FetchBootstrap() (*Bootstrap, error) {
	req, err := http.NewRequest("GET", BASE_URL+"/vi", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
	req.Header.Set("accept-language", "vi,en-US;q=0.9,en;q=0.8")
	req.Header.Set("user-agent", c.UserAgent)
	req.Header.Set("cookie", c.Cookie)
	req.Header.Set("sec-ch-ua", `"Chromium";v="155", "Not?A_Brand";v="24", "Google Chrome";v="155"`)
	req.Header.Set("sec-ch-ua-mobile", "?0")
	req.Header.Set("sec-ch-ua-platform", `"Windows"`)
	req.Header.Set("sec-fetch-dest", "document")
	req.Header.Set("sec-fetch-mode", "navigate")
	req.Header.Set("sec-fetch-site", "none")
	req.Header.Set("sec-fetch-user", "?1")
	req.Header.Set("upgrade-insecure-requests", "1")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	c.mergeCookies(resp.Header["Set-Cookie"])

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return ParseBootstrap(string(bodyBytes))
}

func (c *J2Client) IssueAccessToken(b *Bootstrap, turnstileToken string) (string, error) {
	currentBootstrap := *b
	solution := SolvePow(currentBootstrap)
	if solution == "" {
		return "", fmt.Errorf("could not solve proof of work")
	}

	sendIssue := func(nonce, sol string) (*IssueResponse, error) {
		req, err := http.NewRequest("POST", BASE_URL+"/api/auth/issue", nil)
		if err != nil {
			return nil, err
		}
		req.Header.Set("accept", "application/json, text/plain, */*")
		req.Header.Set("content-type", "application/x-www-form-urlencoded")
		req.Header.Set("origin", BASE_URL)
		req.Header.Set("referer", BASE_URL+"/vi")
		req.Header.Set("user-agent", c.UserAgent)
		req.Header.Set("cookie", c.Cookie)
		req.Header.Set("x-page-nonce", nonce)
		req.Header.Set("x-pow-solution", sol)
		if turnstileToken != "" {
			req.Header.Set("x-turnstile-token", turnstileToken)
		}

		resp, err := c.HTTPClient.Do(req)
		if err != nil {
			return nil, err
		}
		defer resp.Body.Close()

		c.mergeCookies(resp.Header["Set-Cookie"])

		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			return nil, err
		}

		var res IssueResponse
		if err := json.Unmarshal(bodyBytes, &res); err != nil {
			return nil, fmt.Errorf("parse issue response: %w, raw: %s", err, string(bodyBytes))
		}
		return &res, nil
	}

	res, err := sendIssue(currentBootstrap.Nonce, solution)
	if err != nil {
		return "", err
	}

	// Auto-retry if bootstrap_expired
	if res.Error == "bootstrap_expired" && res.Nonce != "" {
		fmt.Println("[!] Server rotated bootstrap nonce. Auto-solving new PoW...")
		freshB := Bootstrap{
			Nonce:         res.Nonce,
			PowChallenge:  res.PowChallenge,
			ChallengeType: res.ChallengeType,
			PowDifficulty: res.PowDifficulty,
		}
		freshSol := SolvePow(freshB)
		res, err = sendIssue(freshB.Nonce, freshSol)
		if err != nil {
			return "", err
		}
	}

	if !res.OK || res.AccessToken == "" {
		return "", fmt.Errorf("issue token failed: %s", res.Error)
	}

	return res.AccessToken, nil
}

func (c *J2Client) ResolveAutolink(mediaURL, accessToken string) (string, error) {
	payload := AutolinkRequest{
		Data: AutolinkData{
			URL:    mediaURL,
			Unlock: true,
		},
	}
	bodyJSON, err := json.Marshal(payload)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequest("POST", BASE_URL+"/api/autolink", bytes.NewReader(bodyJSON))
	if err != nil {
		return "", err
	}
	req.Header.Set("accept", "application/json, text/plain, */*")
	req.Header.Set("content-type", "application/json")
	req.Header.Set("authorization", "Bearer "+accessToken)
	req.Header.Set("origin", BASE_URL)
	req.Header.Set("referer", BASE_URL+"/vi")
	req.Header.Set("user-agent", c.UserAgent)
	req.Header.Set("cookie", c.Cookie)

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	c.mergeCookies(resp.Header["Set-Cookie"])

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	return string(bodyBytes), nil
}

func main() {
	targetURL := "https://www.facebook.com/groups/1528487012172019/permalink/1685137529840299/"
	if len(os.Args) > 1 && os.Args[1] != "" {
		targetURL = os.Args[1]
	}

	cookie := os.Getenv("J2_COOKIE")
	if cookie == "" {
		cookie = DEFAULT_COOKIE
	}

	fmt.Println("==================================================")
	fmt.Println("  j2download.com PoW Solver & Link Resolver (Go)  ")
	fmt.Println("==================================================")
	fmt.Println("[*] Mode: Pure HTTP (ZERO BROWSER / KHÔNG TRÌNH DUYỆT)")
	fmt.Printf("[*] Target URL: %s\n", targetURL)

	client := NewJ2Client(cookie)

	fmt.Println("[*] Fetching page bootstrap...")
	b, err := client.FetchBootstrap()
	if err != nil {
		fmt.Printf("[-] Bootstrap error: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("[+] Got bootstrap: nonce=%s, difficulty=%d, type=%s\n", b.Nonce, b.PowDifficulty, b.ChallengeType)
	t0 := time.Now()
	token, err := client.IssueAccessToken(b, "")
	if err != nil {
		fmt.Printf("[-] Issue access token error: %v\n", err)
		os.Exit(1)
	}
	fmt.Printf("[+] Solved PoW & Acquired Token in %v: %s...\n", time.Since(t0), token[:32])

	fmt.Println("[*] Resolving autolink...")
	res, err := client.ResolveAutolink(targetURL, token)
	if err != nil {
		fmt.Printf("[-] Autolink error: %v\n", err)
		os.Exit(1)
	}

	fmt.Println("==================================================")
	fmt.Println("               MEDIA RESOLVE SUCCESS              ")
	fmt.Println("==================================================")
	fmt.Printf("%s\n", res)
}
