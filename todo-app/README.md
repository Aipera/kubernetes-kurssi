# Todo app – tehtävä 1.4

Node.js-palvelin lukee portin `PORT`-ympäristömuuttujasta.
Tässä versiossa `manifests/deployment.yaml` asettaa portiksi `8080`.

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
