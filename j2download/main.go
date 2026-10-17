package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"time"
)

const (
	BASE_URL   = "https://j2download.com"
	DEFAULT_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36"
)

type IssueResponse struct {
	OK          bool   `json:"ok"`
	AccessToken string `json:"accessToken"`
	Error       string `json:"error"`
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
	return &J2Client{
		HTTPClient: &http.Client{Timeout: 30 * time.Second},
		Cookie:     cookie,
		UserAgent:  DEFAULT_UA,
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
	req.Header.Set("sec-ch-ua", `"Chromium";v="152", "Not?A_Brand";v="24", "Google Chrome";v="152"`)
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

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	return ParseBootstrap(string(bodyBytes))
}

func (c *J2Client) IssueAccessToken(b *Bootstrap, turnstileToken string) (string, error) {
	solution := SolvePow(*b)
	if solution == "" {
		return "", fmt.Errorf("could not solve proof of work")
	}

	req, err := http.NewRequest("POST", BASE_URL+"/api/auth/issue", nil)
	if err != nil {
		return "", err
	}
	req.Header.Set("accept", "application/json, text/plain, */*")
	req.Header.Set("content-type", "application/x-www-form-urlencoded")
	req.Header.Set("origin", BASE_URL)
	req.Header.Set("referer", BASE_URL+"/vi")
	req.Header.Set("user-agent", c.UserAgent)
	req.Header.Set("cookie", c.Cookie)
	req.Header.Set("x-page-nonce", b.Nonce)
	req.Header.Set("x-pow-solution", solution)
	if turnstileToken != "" {
		req.Header.Set("x-turnstile-token", turnstileToken)
	}

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var res IssueResponse
	if err := json.Unmarshal(bodyBytes, &res); err != nil {
		return "", fmt.Errorf("parse issue response: %w, raw: %s", err, string(bodyBytes))
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
		cookie = "session=68718ecc191b88aee567179b3169cd78; cf_clearance=DnHQws86oqmiMsibFPe_0c1.MUuU0XMf8EeUPNlfdsA-1792263995-1.2.1.1-e81g2cXWI6yjanJD4xwOxxM9w_i279JS83It0Z3W6mk5tdq2iI04RGOc2IUQlZNgkqRNKknj4Ev8rYFoyW21rJ8vy6mi1.v7JZXCDzEKRzthStUf2w2PMIFXHVXnWErkeQUpkP2BetxA4JsC35Lhr0lUN5QvUExEgoplyJwId3gSx9d.FUuLdy2znVRHFyNBrcktQ9Q8c.pEUzf0eU3iuWQFfp2rwIkPUevx5pi023cSKpo.QFcrkHog0baMI4djknPFgeRGrsBLDmDYHDjbOiXKT35Gu8sK1TIXmtEpS7muPiO8pTmb5OZD1d0j83.wChNsnbKke4A0ndGjt9krZzZhG7qjAyf7WvlFDRg10R1KjmzEfcLMeXaJJgbPUPpeG5nc1k9DNA_bjSvESeuYJxz.je.WkoyZ_c8qBPfIGgu_ggSMClSdfUTIZGnvvAIX6qsrnnuADaPsmE0YtESrYQ"
	}

	fmt.Println("==================================================")
	fmt.Println("  j2download.com PoW Solver & Link Resolver (Go)  ")
	fmt.Println("==================================================")
	fmt.Printf("[*] Target URL: %s\n", targetURL)

	client := NewJ2Client(cookie)

	fmt.Println("[*] Fetching page bootstrap...")
	b, err := client.FetchBootstrap()
	if err != nil {
		fmt.Printf("[-] Bootstrap error: %v\n", err)
		fmt.Println("[!] Tip: Make sure to provide a valid session & cf_clearance cookie via env J2_COOKIE.")
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

	fmt.Printf("[+] Result:\n%s\n", res)
	_ = url.Values{}
}
