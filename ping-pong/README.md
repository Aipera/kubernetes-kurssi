# Ping-pong – tehtävä 1.9

Ping-pong on Node.js-sovellus, joka vastaa `GET /pingpong` -pyyntöihin.
Ensimmäinen pyyntö saa vastauksen `pong 0`, toinen `pong 1` ja niin edelleen.
Laskuri on sovelluksen muistissa ja nollautuu, kun prosessi käynnistyy uudelleen.

Ping-pongilla on oma Deployment ja Service. Se jakaa Ingressin Log outputin
kanssa. `/pingpong` ohjataan Ping-pongille ja `/log` Log outputille.

## Käynnistys

Aja komennot `ping-pong`-kansiossa, kun `kurssi-network`-klusteri ja
Log output ovat käynnissä. Klusterin Ingress-liikenne on kytketty porttiin `8081`.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t ping-pong:1.9 .
k3d image import ping-pong:1.9 -c kurssi-network
kubectl apply -f manifests\ping-pong.yaml
kubectl rollout status deployment/ping-pong
kubectl apply -f ..\log-output\manifests\ingress.yaml
```

## Testaus

```cmd
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/log
```

Juuri käynnistetty Ping-pong vastaa kahteen ensimmäiseen pyyntöön `pong 0`
ja `pong 1`. `/log` palauttaa edelleen Log outputin aikaleiman ja UUID:n.
