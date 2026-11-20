# 5.6 Trying serverless

Asensin Knative Serving 1.24.0:n paikalliseen k3d-klusteriin.
Klusterin nimi on knative-lab ja Kubernetes-versio on 1.37.2.
Traefik on poistettu käytöstä.

Verkkokerroksena toimii Kourier. Palveluiden osoitteet muodostetaan
Magic DNS -asetuksella käyttäen sslip.io-domainia.
Klusterin HTTP-liikenne on ohjattu koneen porttiin 8087.

## Sovellus

Sovellus käyttää Knativen virallista helloworld-go-konttikuvaa.

- hello-v1 vastaa Hello World!
- hello-v2 vastaa Hello Knative!
- Liikenne jaetaan versioiden kesken suhteessa 50/50.

hello-v1.yaml sisältää ensimmäisen version määrityksen.
hello.yaml sisältää toisen version ja liikenteenjaon.

## Käyttöönotto

Suorita komennot repositorion juuresta Knativen asentamisen jälkeen.
Ensimmäinen versio luodaan ennen liikenteenjaon käyttöönottoa.

```powershell
kubectl --context=k3d-knative-lab apply -f serverless/5.6/hello-v1.yaml

kubectl --context=k3d-knative-lab -n default wait `
    --for=condition=Ready ksvc/hello --timeout=180s

kubectl --context=k3d-knative-lab apply -f serverless/5.6/hello.yaml

kubectl --context=k3d-knative-lab -n default wait ksvc/hello `
    "--for=jsonpath={.status.latestReadyRevisionName}=hello-v2" `
    --timeout=180s

kubectl --context=k3d-knative-lab -n default wait ksvc/hello `
    --for=condition=Ready --timeout=180s
```

## Palvelun kutsuminen

```powershell
$serviceUrl = kubectl --context=k3d-knative-lab -n default `
    get ksvc hello -o jsonpath='{.status.url}'

$serviceHost = ([uri]$serviceUrl).Host

curl.exe -fsS --max-time 60 `
    -H "Host: $serviceHost" http://localhost:8087
```

## Testaus

Palvelun podit poistuivat liikenteen loputtua.
Uusi HTTP-pyyntö käynnisti uuden podin ja palautti vastauksen.

Liikenteenjakoa testattiin sadalla peräkkäisellä HTTP-pyynnöllä.

| Vastaus | Määrä |
| --- | --- |
| Hello World! | 50 |
| Hello Knative! | 50 |

Knative ilmoitti molempien versioiden liikenneosuudeksi 50 prosenttia.
