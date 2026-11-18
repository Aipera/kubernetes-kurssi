## 4.5 Done field

Tehtävillä on kentät `id`, `text` ja `done`. Backend lisää olemassa olevaan PostgreSQL-tauluun `done`-sarakkeen, jonka oletusarvo on `false`.

`GET /todos` palauttaa tehtävät olioina. Tehtävän tilaa päivitetään pyynnöllä `PUT /todos/<id>`.

```json
{"done": true}
```

Onnistunut päivitys palauttaa HTTP-tilakoodin `200` ja päivitetyn tehtävän. Tuntematon tunniste palauttaa `404`. Virheellinen done-arvo palauttaa `400`.

[GKE-reititys](../gke/todo.yaml) ohjaa myös `/todos/<id>`-pyynnöt backendille.
