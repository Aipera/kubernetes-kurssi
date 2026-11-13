## 3.10 – PostgreSQL-varmuuskopio Cloud Storageen

GKE:n `project`-namespacessa toimiva `todo-db-backup`-CronJob
varmuuskopioi `todo`-tietokannan päivittäin klo 02.00 UTC.
`pg_dump` luo varmuuskopion, ja `pg_restore --list` tarkistaa,
että sen sisällysluettelo on luettavissa. Toinen kontti tallentaa
tiedoston Cloud Storageen polkuun `gs://dwk-todo-backups-284715909721/todo/`.

CronJob tunnistautuu Google Cloudiin Workload Identity Federationilla.
Kubernetesin `todo-backup`-palvelutili käyttää Google Cloudin
`todo-backup-storage`-palvelutilin bucket-oikeuksia.

### Testaus

Käynnistin CronJobista kertaluonteisen Jobin. Job valmistui,
lokissa näkyi `Backup uploaded to gs://...` ja `.dump`-tiedosto
näkyi bucketin listauksessa.
