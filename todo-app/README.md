# Todo app – tehtävä 1.8

Traefik Ingress ohjaa etusivun `/` pyynnöt `todo-app`-palvelulle.
Palvelu välittää ne Node.js-sovelluksen porttiin `8080`.

## Käynnistys

Aja komennot `todo-app`-kansiossa. Ohje käyttää `kurssi-network`-klusteria,
jonka Ingress-liikenne on kytketty paikalliseen porttiin `8081`.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t todo-app:1.5 .
k3d image import todo-app:1.5 -c kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/todo-app
```

Avaa selaimessa [http://localhost:8081/](http://localhost:8081/).
Sivulla pitäisi näkyä otsikko **Todo app**.
