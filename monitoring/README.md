## 4.3 Prometheus

Asensin Prometheuksen Helmillä GKE-klusterin `monitoring`-namespaceen. `kube-state-metrics` tuotti podien tiedot Prometheukselle.

Avasin Prometheuksen käyttöliittymän Service-resurssin kautta. PowerShellissä `$gkeContext` sisältää GKE-klusterin kontekstin nimen.

```powershell
kubectl --context=$gkeContext -n monitoring port-forward svc/prom-prometheus-server 9090:80
```

Ajoin [Prometheuksen Query-näkymässä](http://localhost:9090/) kyselyn, joka laskee `prometheus`-namespacen StatefulSetien luomat podit.

```promql
count(kube_pod_info{namespace="prometheus",created_by_kind="StatefulSet"})
```

Loin `prometheus`-namespaceen `statefulset-test`-StatefulSetin kolmella testipodilla. Poistin testikontin CPU-pyynnön, jotta podit voitiin ajoittaa klusterin ainoalle nodelle. Kun kolme podia oli käynnistynyt, kysely palautti arvon **3**.

![Prometheus-kysely näyttää kolme StatefulSet-podia](./4.3-prometheus.png)
