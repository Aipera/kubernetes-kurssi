# Todo app – tehtävä 1.5

Todo app on Node.js-palvelin, joka palauttaa HTML-etusivun `GET /` -pyyntöön.
Kubernetesissa palvelin kuuntelee porttia `8080`, joka on määritetty
`PORT`-ympäristömuuttujalla tiedostossa `manifests/deployment.yaml`.

## Käynnistys ja selaintesti

Aja komennot `todo-app`-kansiossa, kun `k3s-default`-klusteri on käynnissä.

```cmd
docker build -t todo-app:1.5 .
k3d image import todo-app:1.5 -c k3s-default
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/todo-app
kubectl port-forward deployment/todo-app 3003:8080
```

Pidä porttiohjaus käynnissä ja avaa selaimessa [http://localhost:3003/](http://localhost:3003/).
Sivulla pitäisi näkyä otsikko **Todo app**. Porttiohjaus välittää
koneen portin `3003` liikenteen sovelluksen porttiin `8080`.
Voit lopettaa porttiohjauksen painamalla **Ctrl+C**.
