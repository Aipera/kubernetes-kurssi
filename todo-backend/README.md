## 2.8 – The project, step 11

Todo Backend tallentaa tehtävät PostgreSQL-tietokantaan. Tietokanta toimii yhden replikan StatefulSetinä `project`-namespacessa ja käyttää pysyvää `local-path`-levyä. Backend saa salasanan `todo-postgres-auth`-Secretistä.

`GET /todos` palauttaa tehtävälistan ja `POST /todos` tallentaa uuden tehtävän. Vanha tehtävälista tuotiin ensimmäisellä käynnistyksellä `todo-initial-data`-ConfigMapista tyhjään tietokantaan.

### Käyttöönotto

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä. Luo ensimmäisellä käyttöönotolla `project`-namespaceen `todo-postgres-auth`-Secret, jonka `password`-avaimessa on itse valitsemasi salasana.

```cmd
kubectl config use-context k3d-kurssi-network
kubectl -n project apply -f todo-backend\manifests\postgres.yaml
kubectl -n project rollout status statefulset/todo-postgres --timeout=180s
docker build -t todo-backend:2.8 todo-backend
k3d image import todo-backend:2.8 -c kurssi-network
kubectl -n project apply -f todo-backend\manifests\todo-backend.yaml
kubectl -n project rollout status deployment/todo-backend --timeout=120s
```

### Säilymistesti

Lisää selaimessa tehtävä `Testi 2.8`. Käynnistä backend uudelleen ja tarkista, että tehtävä näkyy edelleen API:n palauttamassa listassa.

```cmd
kubectl -n project rollout restart deployment/todo-backend
kubectl -n project rollout status deployment/todo-backend --timeout=120s
curl.exe -f http://localhost:8081/todos
```
