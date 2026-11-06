# Todo app – tehtävä 1.13

Todo app näyttää etusivulla satunnaisen kuvan, tekstikentän, Send-painikkeen
ja kolme valmiiksi määriteltyä tehtävää. Tekstikenttä hyväksyy enintään
140 merkkiä. Send-painikkeen toiminnallisuus lisätään myöhemmin.

Kuva tallennetaan pysyvälle levylle ja uusitaan, kun seuraava kuvapyyntö
saapuu kuvan vanhennuttua. Kuva on voimassa 10 minuuttia.

## Käynnistys

Aja komennot `todo-app`-kansiossa, kun `kurssi-network`-klusteri on käynnissä.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t todo-app:1.13 .
k3d image import todo-app:1.13 -c kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/todo-app
```

## Testaus

Avaa [http://localhost:8081/](http://localhost:8081/). Tarkista, että kuvan alla
näkyvät tekstikenttä, Send-painike ja kolme tehtävää. Liitä kenttään yli
140 tavallista kirjainta ja varmista, että kenttään jää enintään 140 merkkiä.
