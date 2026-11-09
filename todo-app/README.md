## 2.4 – The project, step 9

Todo App ja Todo Backend toimivat `project`-namespacessa. Yhteinen Ingress ohjaa `/todos`-pyynnöt backendille. Todo Appin kuvavälimuisti käyttää `todo-image-cache`-PVC:tä samassa namespacessa.

### Käynnistä projekti

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä, kun `kurssi-network`-klusteri on käynnissä.

```cmd
docker build -t todo-app:2.2 todo-app
docker build -t todo-backend:2.2 todo-backend
k3d image import todo-app:2.2 todo-backend:2.2 -c kurssi-network

kubectl config use-context k3d-kurssi-network
kubectl apply -f project-namespace.yaml
kubectl -n project apply -f todo-app\manifests -f todo-backend\manifests
kubectl -n project rollout status deployment/todo-app
kubectl -n project rollout status deployment/todo-backend
```

### Testaa sovellus

```cmd
kubectl -n project get deployments,services,ingress,pvc
curl.exe -f http://localhost:8081/todos
```

Tarkista, että molemmat Deploymentit ovat valmiita, `todo-image-cache` on `Bound` ja `/todos` palauttaa JSON-listan. Avaa [Todo App](http://localhost:8081) ja varmista, että kuva näkyy ja uusi tehtävä ilmestyy listaan **Send**-painikkeella.
