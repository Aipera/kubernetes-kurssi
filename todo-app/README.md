## 4.5 Done field

Tehtävän voi merkitä valmiiksi Mark done -painikkeella. Painike lähettää backendille `PUT /todos/<id>` -pyynnön.

```json
{"done": true}
```

Valmiin tehtävän teksti yliviivataan ja sen vieressä näytetään Done. Tila tallennetaan PostgreSQL-tietokantaan.

Testasin toiminnan GKE:ssä lisäämällä tehtävän, merkitsemällä sen valmiiksi ja päivittämällä sivun. Tehtävä säilyi valmiina sivun päivityksen jälkeen.
