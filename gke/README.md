# 3.5 – Todo with Kustomize

Todo-sovellus on otettu käyttöön Google Kubernetes Enginessä `project`-namespacessa. Repositorion juuressa oleva `kustomization.yaml` kokoaa Kubernetes-manifestit ja valitsee Artifact Registrystä `todo-app:3.5`- ja `todo-backend:3.5`-kuvat.

Todo käyttää yhteistä `exercises-gateway`-Gatewayta. Reitit `/` ja `/image.jpg` ohjataan käyttöliittymälle, ja `/todos` ohjataan taustapalvelulle. PostgreSQL tallentaa tehtävät pysyvälle `standard-rwo`-levylle. Myös kuvavälimuisti käyttää pysyvää levyä.

## Käyttöönotto

Aja komennot Windowsin Google Cloud SDK Shellissä Docker Desktopin ollessa käynnissä. Ohje käyttää aiemmin luotua GKE-klusteria, `kurssi`-repositoriota Artifact Registryssä ja `exercises-gateway`-Gatewayta.

```cmd
cd /d "%USERPROFILE%\kubernetes-kurssi"
set "GKE_CTX=gke_project-e08f1dba-8ab7-491a-90a_europe-north1-b_dwk-cluster"
set "REGISTRY=europe-north1-docker.pkg.dev/project-e08f1dba-8ab7-491a-90a/kurssi"

docker build --platform linux/amd64 -t "%REGISTRY%/todo-app:3.5" todo-app
docker push "%REGISTRY%/todo-app:3.5"
docker build --platform linux/amd64 -t "%REGISTRY%/todo-backend:3.5" todo-backend
docker push "%REGISTRY%/todo-backend:3.5"
```

Luo `project`-namespace ja PostgreSQL:n Secret ensimmäisellä asennuskerralla. PowerShell-komento luo satunnaisen salasanan.

```cmd
kubectl --context="%GKE_CTX%" create namespace project
powershell -NoProfile -Command "$secretArg = '--from-literal=password=' + [guid]::NewGuid().ToString('N'); kubectl --context $env:GKE_CTX -n project create secret generic todo-postgres-auth $secretArg"
```

Päivitä Gateway sallimaan reitit `project`-namespacesta ja ota Todo-projekti käyttöön Kustomizella.

```cmd
kubectl --context="%GKE_CTX%" -n exercises apply -f log-output\gke\routing.yaml
kubectl --context="%GKE_CTX%" -n project apply -k .

kubectl --context="%GKE_CTX%" -n project rollout status statefulset/todo-postgres --timeout=300s
kubectl --context="%GKE_CTX%" -n project rollout status deployment/todo-backend --timeout=300s
kubectl --context="%GKE_CTX%" -n project rollout status deployment/todo-app --timeout=300s
```

## Testaus

Avaa selaimessa Gatewayn julkinen osoite. Käyttöönoton testissä osoite oli `http://136.82.24.113/`.

Lisää tehtävä **Testi 3.5** ja päivitä sivu. Tarkista, että tehtävä näkyy edelleen sivulla ja että API palauttaa sen.

```cmd
curl.exe -f http://136.82.24.113/todos
```

Testissä `/todos` vastasi `HTTP 200 OK`, ja selaimessa lisätty tehtävä näkyi sivun päivityksen jälkeen.
