# Todo app – tehtävä 1.2

Node.js-HTTP-palvelin käyttää oletuksena porttia 3000. Portin voi vaihtaa
`PORT`-ympäristömuuttujalla. Palvelin tulostaa käynnistyessään käytössä olevan portin.

## Käynnistys paikallisessa Kubernetes-klusterissa

Aja komennot `todo-app`-kansiossa, kun `k3s-default`-klusteri on käynnissä.

```cmd
docker build -t todo-app:1.2 .
k3d image import todo-app:1.2 -c k3s-default
kubectl create deployment todo-app --image=todo-app:1.2
kubectl rollout status deployment/todo-app
kubectl logs deployment/todo-app
```

Lokissa pitäisi näkyä `Server started in port 3000`.

## Portin vaihtamisen testaus

```cmd
kubectl set env deployment/todo-app PORT=8080
kubectl rollout status deployment/todo-app
kubectl logs deployment/todo-app
```

Uuden Podin lokissa pitäisi näkyä `Server started in port 8080`.
