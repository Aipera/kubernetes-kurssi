## 2.3 – Keep them separated

Ping-pong toimii `exercises`-namespacessa yhdessä Log outputin kanssa. Molemmat sovellukset käyttävät yhteistä Ingressiä.

- `GET /pingpong` palauttaa `pong`-vastauksen ja kasvattaa laskuria.
- `GET /pongs` palauttaa laskurin arvon kasvattamatta sitä. Log output käyttää tätä reittiä klusterin sisällä.

Katso [sovellusten käynnistysohje](../log-output/README.md#käynnistä-sovellukset).

### Testaa Ping-pong

```cmd
kubectl -n exercises get deployment,service ping-pong
curl.exe http://localhost:8081/pingpong
curl.exe http://localhost:8081/pingpong
```

Toisen `pong`-vastauksen numero on yhtä suurempi kuin ensimmäisen.
