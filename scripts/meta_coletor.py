#!/usr/bin/env python3
"""Coleta SOMENTE LEITURA do Meta Ads (Marketing API) e salva JSON em dados/.

Uso: python3 scripts/meta_coletor.py [last_7d|last_14d|last_30d]
Lê META_ACCESS_TOKEN, META_AD_ACCOUNT_ID, META_API_VERSION do ambiente ou do .env.
"""
import json, os, sys, urllib.parse, urllib.request
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
CONVERSA = "onsite_conversion.messaging_conversation_started_7d"


def carregar_env():
    arq = RAIZ / ".env"
    if arq.exists():
        for linha in arq.read_text().splitlines():
            if "=" in linha and not linha.lstrip().startswith("#"):
                k, v = linha.split("=", 1)
                os.environ.setdefault(k.strip(), v.split("#")[0].strip())


def buscar(url):
    itens = []
    while url:
        with urllib.request.urlopen(url, timeout=60) as r:
            corpo = json.load(r)
        itens += corpo.get("data", [])
        url = corpo.get("paging", {}).get("next")
    return itens


def valor(lista, tipo):
    for a in lista or []:
        if a.get("action_type") == tipo:
            return float(a["value"])
    return 0.0


def main():
    carregar_env()
    token, conta = os.environ.get("META_ACCESS_TOKEN"), os.environ.get("META_AD_ACCOUNT_ID")
    if not token or not conta:
        sys.exit("Defina META_ACCESS_TOKEN e META_AD_ACCOUNT_ID (veja .env.example).")
    versao = os.environ.get("META_API_VERSION", "v21.0")
    periodo = sys.argv[1] if len(sys.argv) > 1 else "last_7d"
    params = {
        "access_token": token,
        "level": "ad",
        "date_preset": periodo,
        "breakdowns": "publisher_platform,platform_position",
        "fields": ",".join([
            "campaign_name", "adset_name", "ad_id", "ad_name", "spend", "impressions",
            "reach", "frequency", "clicks", "inline_link_click_ctr", "cpm",
            "actions", "cost_per_action_type",
        ]),
        "limit": 200,
    }
    url = f"https://graph.facebook.com/{versao}/act_{conta}/insights?" + urllib.parse.urlencode(params)
    linhas = []
    for x in buscar(url):
        gasto = float(x.get("spend", 0))
        conversas = valor(x.get("actions"), CONVERSA)
        linhas.append({
            "campanha": x.get("campaign_name"), "conjunto": x.get("adset_name"),
            "anuncio_id": x.get("ad_id"), "anuncio": x.get("ad_name"),
            "plataforma": x.get("publisher_platform"), "posicao": x.get("platform_position"),
            "gasto": gasto, "impressoes": int(x.get("impressions", 0)),
            "alcance": int(x.get("reach", 0)), "frequencia": float(x.get("frequency", 0)),
            "ctr_link": float(x.get("inline_link_click_ctr", 0)), "cpm": float(x.get("cpm", 0)),
            "conversas": conversas,
            "custo_por_conversa": round(gasto / conversas, 2) if conversas else None,
        })
    saida = RAIZ / "dados" / f"meta_{periodo}_{date.today().isoformat()}.json"
    saida.write_text(json.dumps(linhas, ensure_ascii=False, indent=2))
    print(f"{len(linhas)} linhas salvas em {saida.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
