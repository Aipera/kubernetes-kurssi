## 4.4 Your canary

Ping-pong päivittyy Argo Rolloutsin canary-strategialla. Rollout käyttää nykyistä Deploymentia podimallina.

AnalysisTemplate seuraa kaikkien sovelluskonttien yhteenlaskettua CPU-käyttöä `exercises`-namespacessa.

```promql
sum(rate(container_cpu_usage_seconds_total{
  namespace="exercises",
  container!="",
  container!="POD"
}[5m]))
```

Analyysi tekee kymmenen mittausta 30 sekunnin välein. Ensimmäinen mittaus tehdään 30 sekunnin kuluttua ja viimeinen noin viiden minuutin kohdalla.

CPU-kulutuksen pitää pysyä alle 0.5 CPU:n. Ensimmäinen epäonnistunut mittaus keskeyttää päivityksen ja palauttaa ajossa olevat podit vakaaseen versioon.

Testitulokset

- Rajalla `0.5` analyysi onnistui viidessä minuutissa.
- Rajalla `0` analyysi epäonnistui 30 sekunnissa. Vakaan version tunniste säilyi samana ja sovellus vastasi edelleen.
- Normaalin rajan palautuksen jälkeen analyysi onnistui ja Rollout palautui `Healthy`-tilaan.

[AnalysisTemplate](gke/analysis-template.yaml) · [Rollout](gke/rollout.yaml)
