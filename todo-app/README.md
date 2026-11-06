# Todo app – tehtävä 1.12

Todo app näyttää etusivulla satunnaisen kuvan Lorem Picsumista.
Sovellus tallentaa kuvan tiedostoon `/cache/image.jpg` pysyvälle
`todo-image-cache`-levylle. Sama kuva tarjoillaan 10 minuutin ajan.
Kun kuva vanhenee, seuraava kuvapyyntö hakee uuden kuvan.

## Käynnistys

Aja komennot `todo-app`-kansiossa, kun `kurssi-network`-klusteri on käynnissä.

```cmd
kubectl config use-context k3d-kurssi-network
docker build -t todo-app:1.12 .
k3d image import todo-app:1.12 -c kurssi-network
kubectl apply -f manifests
kubectl rollout status deployment/todo-app
kubectl get pvc todo-image-cache
```

PVC:n pitäisi näkyä tilassa `Bound`. Avaa selaimessa
[http://localhost:8081/](http://localhost:8081/).

## Testaus

1. Päivitä sivu 10 minuutin sisällä. Kuvan pitäisi pysyä samana.
2. Käynnistä Deployment uudelleen alla olevilla komennoilla ja päivitä sivu
   ennen kuin 10 minuuttia on kulunut kuvan latauksesta. Kuvan pitäisi säilyä.
3. Päivitä sivu uudelleen, kun kuvan latauksesta on kulunut yli 10 minuuttia.
   Sovellus hakee uuden kuvan.

```cmd
kubectl rollout restart deployment/todo-app
kubectl rollout status deployment/todo-app
```
