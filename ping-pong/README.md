# 3.1 – Ping-pong GKE

Ping-pong toimii Google Kubernetes Enginessä. Sovelluksen `LoadBalancer`-palvelu tarjoaa julkisen IP-osoitteen. PostgreSQL tallentaa laskurin pysyvälle `standard-rwo`-levylle.

## Käyttöönotto

Aja komennot Windowsin Google Cloud SDK Shellissä. Ohjeessa käytetään valmista `dwk-cluster`-klusteria ja Artifact Registryyn ladattua Ping-pongin kuvaa.

```cmd
cd /d "%USERPROFILE%\kubernetes-kurssi"
set "GKE_CTX=gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster"
kubectl --context="%GKE_CTX%" get nodes
```

Luo `exercises`-namespace ja tietokannan Secret ensimmäisellä asennuskerralla. PowerShell-komento luo satunnaisen salasanan.

```cmd
kubectl --context="%GKE_CTX%" create namespace exercises
powershell -NoProfile -Command "$secretArg = '--from-literal=password=' + [guid]::NewGuid().ToString('N'); kubectl --context $env:GKE_CTX -n exercises create secret generic ping-pong-postgres-auth $secretArg"
```

Käynnistä PostgreSQL ja odota, että se on valmis. Käynnistä sitten Ping-pong.

```cmd
kubectl --context="%GKE_CTX%" -n exercises apply -f ping-pong\gke\postgres.yaml
kubectl --context="%GKE_CTX%" -n exercises rollout status statefulset/ping-pong-postgres --timeout=300s
kubectl --context="%GKE_CTX%" -n exercises apply -f ping-pong\gke\ping-pong.yaml
kubectl --context="%GKE_CTX%" -n exercises rollout status deployment/ping-pong --timeout=300s
```

## Testaus

Tarkista palvelun `EXTERNAL-IP`.

```cmd
kubectl --context="%GKE_CTX%" -n exercises get svc ping-pong
```

Tämän asennuksen julkinen IP oli `34.88.163.32`. Käytä testeissä palvelun nykyistä `EXTERNAL-IP`-osoitetta.

```cmd
curl.exe -f http://34.88.163.32/pingpong
curl.exe -f http://34.88.163.32/pingpong
```

Ensimmäisessä testissä vastaukset olivat `pong 0` ja `pong 1`. Laskuri kasvoi yhdellä toisella pyynnöllä.
