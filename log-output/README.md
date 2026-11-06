# Log output – tehtävä 1.7

Sovellus arpoo käynnistyessään UUID:n ja tulostaa sen aikaleiman kanssa
viiden sekunnin välein. Ingress ohjaa selaimen `/log`-pyynnöt sovellukselle.

## Käynnistys

Aja komennot `log-output`-kansiossa. Ohje käyttää `kurssi-network`-klusteria,
jonka Ingress-liikenne on kytketty paikalliseen porttiin `8081`.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t log-output:1.7 .
k3d image import log-output:1.7 -c kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/log-output
```

Avaa selaimessa [http://localhost:8081/log](http://localhost:8081/log).
Päivitä sivu ja tarkista, että aikaleima vaihtuu ja UUID pysyy samana.
