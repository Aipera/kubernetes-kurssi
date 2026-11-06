# Log output – tehtävä 1.10

Log output toimii kahdessa kontissa samassa Podissa. `writer` arpoo
käynnistyessään UUID:n ja lisää tiedostoon `/shared/output.log` uuden
aikaleimatun rivin viiden sekunnin välein. `reader` lukee tiedoston
ja palauttaa sen sisällön `GET /log` -pyyntöön.

Kontit jakavat tiedoston `emptyDir`-volyymin kautta. Kun Pod korvataan
uudella, uusi Pod aloittaa tyhjällä volyymilla.

## Käynnistys

Aja komennot `log-output`-kansiossa, kun `kurssi-network`-klusteri
on käynnissä ja sen Ingress-liikenne on kytketty porttiin `8081`.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t log-output:1.10 .
k3d image import log-output:1.10 -c kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/log-output
kubectl get pods -l app=log-output
```

## Testaus

Tarkista, että Pod näkyy tilassa `2/2 Running`. Avaa selaimessa
[http://localhost:8081/log](http://localhost:8081/log).
Odota vähintään viisi sekuntia ja päivitä sivu. Lokissa pitäisi näkyä
uusi rivi, jossa aikaleima vaihtuu ja UUID pysyy samana.
