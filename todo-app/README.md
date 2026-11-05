# Todo app – tehtävä 1.2

Node.js-HTTP-palvelin käyttää oletuksena porttia 3000. Portin voi vaihtaa
`PORT`-ympäristömuuttujalla. Palvelin tulostaa käynnistyessään käytössä olevan portin.

## Käynnistys paikallisessa Kubernetes-klusterissa

Aja komennot `todo-app`-kansiossa, kun `k3s-default`-klusteri on käynnissä.

```cmd
docker build -t todo-app:1.2 .
k3d image import todo-app:1.2 -c k3s-default
kubectl apply -f manifests/deployment.yaml
kubectl rollout status deployment/todo-app
kubectl logs deployment/todo-app
```

Lokissa pitäisi näkyä `Server started in port 8080`.
