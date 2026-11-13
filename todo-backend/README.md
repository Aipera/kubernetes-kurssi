## 2.9 – The project, step 12

`read-wikipedia`-CronJob ajetaan `project`-namespacessa tasatunnein (`0 * * * *`). Se lukee satunnaisen Wikipedia-artikkelin osoitteen `Special:Random`-vastauksen `Location`-otsakkeesta ja lisää Todo Backendiin tehtävän muodossa `Read <URL>`.

### Käyttöönotto ja testaus

Aja komennot repositorion juurikansiossa Windowsin CMD:ssä, kun Todo Backend on käynnissä.

```cmd
kubectl -n project apply -f todo-backend\manifests\read-wikipedia-cronjob.yaml
kubectl -n project create job --from=cronjob/read-wikipedia read-wikipedia-test
kubectl -n project wait --for=condition=complete job/read-wikipedia-test --timeout=120s
kubectl -n project logs job/read-wikipedia-test
curl.exe -f http://localhost:8081/todos
```

Testi onnistuu, kun lokissa näkyy `Created todo: Read ...` ja sama tehtävä löytyy `/todos`-listasta. Käytä uudessa testiajossa eri Job-nimeä, esimerkiksi `read-wikipedia-test-2`.
