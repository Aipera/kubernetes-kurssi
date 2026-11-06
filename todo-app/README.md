# Todo app – tehtävä 2.2

Todo app näyttää kuvan, tehtävälistan ja lomakkeen uuden tehtävän lisäämiseen.
Kuva säilyy pysyvällä levyllä, ja sen välimuisti on voimassa 10 minuuttia.

Selain hakee listan `GET /todos` -pyynnöllä ja lähettää uuden tehtävän
`POST /todos` -pyynnöllä. Ingress ohjaa nämä pyynnöt `todo-backend`-palvelulle.

## Käynnistys

Aja komennot repositorion juurikansiossa, kun `kurssi-network`-klusteri on käynnissä.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t todo-backend:2.2 todo-backend
docker build -t todo-app:2.2 todo-app
k3d image import todo-backend:2.2 todo-app:2.2 -c kurssi-network
kubectl apply -f todo-backend\manifests
kubectl apply -f todo-app\manifests
kubectl rollout status deployment/todo-backend
kubectl rollout status deployment/todo-app
```

## Testaus

Avaa [http://localhost:8081/](http://localhost:8081/). Kirjoita tehtävä ja
paina **Send**. Tarkista, että tehtävä näkyy listassa myös sivun päivityksen
jälkeen. [http://localhost:8081/todos](http://localhost:8081/todos)
näyttää saman listan JSON-muodossa.
