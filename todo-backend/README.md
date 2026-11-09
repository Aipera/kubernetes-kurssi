## 2.4 – The project, step 9

Todo Backendin Deployment ja Service ovat `project`-namespacessa. Todo Appin Ingress ohjaa `/todos`-pyynnöt `todo-backend`-Servicelle.

- `GET /todos` palauttaa tehtävälistan JSON-muodossa.
- `POST /todos` lisää uuden tehtävän. Tehtävät tallennetaan backendin muistiin.

Katso [projektin käynnistysohje](../todo-app/README.md).

```cmd
kubectl -n project get deployment,service todo-backend
curl.exe -f http://localhost:8081/todos
```
