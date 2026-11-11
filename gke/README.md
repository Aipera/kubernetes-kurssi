## 3.6 – Automatic deployment

GitHub Actions ottaa Todo-projektin automaattisesti käyttöön GKE:ssä, kun `main`-haaraan viedään uusi commit. Workflow on tiedostossa [deploy-todo.yaml](../.github/workflows/deploy-todo.yaml).

Workflow rakentaa `todo-app`- ja `todo-backend`-konttikuvat, merkitsee ne commitin SHA:lla ja julkaisee ne Artifact Registryssä `kurssi`-repositoriossa. Sen jälkeen se asettaa uudet kuvat Kustomizeen, ottaa manifestit käyttöön `project`-namespacessa ja odottaa, että molemmat Deploymentit valmistuvat.

GitHub Actions kirjautuu Google Cloudiin Workload Identity Federationilla. Repositorion muuttujat `GCP_WIF_PROVIDER` ja `GCP_DEPLOY_SERVICE_ACCOUNT` määrittävät käytettävän tunnistuspalvelun ja palvelutilin. Käyttöönoton Kubernetes-oikeudet on rajattu `project`-namespaceen.

Todo-käyttöliittymä käyttää `Recreate`-strategiaa, joka lopettaa vanhan Podin ennen uuden luomista. Kuvavälimuisti käyttää `ReadWriteOnce`-levyä.

### Testaus

Ensimmäinen automaattinen ajo käynnistyi commitista `a8725dc` ja valmistui onnistuneesti. Päivityksen jälkeen Todo-sovellus avautui selaimessa ja aiemmat tehtävät latautuivat PostgreSQL:stä.

Ajon voi tarkistaa GitHubin **Actions**-välilehdeltä valitsemalla **Deploy Todo to GKE**. Vaihe **Deploy with Kustomize** näyttää molempien Deploymenttien tilan ja käytössä olevat kuvatagit.
