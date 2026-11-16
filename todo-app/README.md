## 3.11 Resource requests and limits

Lisäsin Todo-projektin GKE-manifesteihin CPU- ja muistipyynnöt sekä rajat.

| Kontti | CPU-pyyntö | CPU-raja | Muistipyyntö | Muistiraja |
| --- | ---: | ---: | ---: | ---: |
| Todo App | 50m | 300m | 128Mi | 256Mi |
| Todo Backend | 50m | 300m | 128Mi | 256Mi |
| PostgreSQL | 100m | 500m | 256Mi | 512Mi |
| Wikipedia-CronJob | 50m | 300m | 128Mi | 256Mi |
| Varmuuskopio `dump` | 25m | 500m | 64Mi | 256Mi |
| Varmuuskopio `upload` | 25m | 500m | 128Mi | 512Mi |

### Testaus GKE:ssä

Mittasin konttien käyttöä komennolla `kubectl -n project top pods --containers`.
Mittaushetkellä Todo App käytti 1m CPU:ta ja 9 MiB muistia, Todo Backend
2m ja 13 MiB sekä PostgreSQL 6m ja 25 MiB. Kaikki kolme olivat käynnissä
ilman uudelleenkäynnistyksiä. Lisäsin selaimessa uuden tehtävän ja
varmistin, että se näkyi sivun päivityksen jälkeen.

Varmuuskopion ensimmäinen ajo uusilla rajoilla jäi `Pending`-tilaan
virheellä `Insufficient cpu`. Pienensin `dump`- ja `upload`-konttien
CPU-pyynnöt arvoon `25m`. Uusi testiajo valmistui, ja loki vahvisti
`.dump`-tiedoston siirron Cloud Storageen.

[Todo App](manifests/deployment.yaml) · [Todo Backend](../todo-backend/manifests/todo-backend.yaml) · [PostgreSQL](../gke/todo.yaml) · [Wikipedia-CronJob](../todo-backend/manifests/read-wikipedia-cronjob.yaml) · [Varmuuskopio-CronJob](../gke/todo-db-backup.yaml)
