package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
)

type Bootstrap struct {
	Nonce         string `json:"nonce"`
	PowChallenge  string `json:"powChallenge"`
	ChallengeType string `json:"challengeType"`
	PowDifficulty int    `json:"powDifficulty"`
}

func HasLeadingZeroNibbles(b []byte, difficulty int) bool {
	fullBytes := difficulty / 2
	hasHalfByte := (difficulty & 1) == 1

	for i := 0; i < fullBytes; i++ {
		if b[i] != 0 {
			return false
		}
	}
	if hasHalfByte && (b[fullBytes]&0xF0) != 0 {
		return false
	}
	return true
}

func DeriveAltChallenge(challenge, nonce, solution string) string {
	msg := fmt.Sprintf("pow:alt:%s:%s:%s", challenge, nonce, solution)
	h := sha256.Sum256([]byte(msg))
	return hex.EncodeToString(h[:16])
}

func SolveSinglePow(challengeType, challenge, nonce string, difficulty int, maxIter int) string {
	var prefix, suffix string
	if challengeType == "alt" {
		prefix = "pow:" + nonce + ":"
		suffix = ":" + challenge
	} else {
		prefix = "pow:" + challenge + ":"
		suffix = fmt.Sprintf(":%s:%d", nonce, len(challenge))
	}

	for n := 0; n < maxIter; n++ {
		input := prefix + strconv.Itoa(n) + suffix
		h := sha256.Sum256([]byte(input))
		if HasLeadingZeroNibbles(h[:], difficulty) {
			return strconv.Itoa(n)
		}
	}
	return ""
}

func SolvePow(b Bootstrap) string {
	cType := b.ChallengeType
	if cType == "" {
		cType = "classic"
	}

	first := SolveSinglePow(cType, b.PowChallenge, b.Nonce, b.PowDifficulty, 100000000)
	if first == "" {
		return ""
	}
	if cType != "alt" {
		return first
	}

	secondChallenge := DeriveAltChallenge(b.PowChallenge, b.Nonce, first)
	second := SolveSinglePow(cType, secondChallenge, b.Nonce, b.PowDifficulty, 100000000)
	if second == "" {
		return ""
	}
	return first + "." + second
}

var bootstrapRegex = regexp.MustCompile(`window\.__BOOTSTRAP__\s*=\s*({[^<]+?});`)

func ParseBootstrap(html string) (*Bootstrap, error) {
	match := bootstrapRegex.FindStringSubmatch(html)
	if len(match) < 2 {
		return nil, fmt.Errorf("bootstrap object not found in HTML")
	}
	var b Bootstrap
	if err := json.Unmarshal([]byte(match[1]), &b); err != nil {
		return nil, err
	}
	return &b, nil
}
