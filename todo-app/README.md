# Todo app – tehtävä 1.6

Todo app vastaa `GET /` -pyyntöön HTML-sivulla. Kubernetesin
NodePort Service ohjaa liikenteen noden portista `30080` sovelluksen
porttiin `8080`. k3d julkaisee noden portin Windowsin portissa `8082`.

## Käynnistys

Aja komennot `todo-app`-kansiossa. Ohje käyttää `kurssi-network`-klusteria,
joka on luotu porttikytkennällä `8082:30080@agent:0`.

```cmd
docker build -t todo-app:1.5 .
k3d image import todo-app:1.5 -c kurssi-network
kubectl config use-context k3d-kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/todo-app
kubectl get service todo-app
```

Avaa selaimessa [http://localhost:8082/](http://localhost:8082/).
Sivulla pitäisi näkyä **Todo app**.
