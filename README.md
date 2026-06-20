# はなカウンタ

## サービスURL

はなカウンタ: https://hana-counter.hanacus87.net

## アーキテクチャ

```mermaid
flowchart LR
    spa["Browser<br/>(React SPA)"]
    worker["Cloudflare Worker<br/>(Hono)"]
    d1[("D1")]
    google(["Google OIDC"])

    spa <--> worker
    worker <--> d1
    worker <--> google
```
