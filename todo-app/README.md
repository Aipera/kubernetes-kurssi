## 3.8 – Automaattinen esikatseluympäristön poisto

GitHub Actionsin **Delete Todo preview environment** -työnkulku käynnistyy, kun GitHubista poistetaan haara. Työnkulku tarkistaa, että GKE:n esikatselun namespace kuuluu poistetulle haaralle, ja poistaa sen. Samalla poistuvat namespacen sovellukset, PostgreSQL ja levyvaraukset. Saman haaran julkaisu- ja poistotyöt käyttävät yhteistä jonoa.

### Testaus ja tulos

Poistin GitHubista `testi-37`-haaran. GKE hyväksyi poistopyynnön, ja ensimmäinen Actions-ajo saavutti viiden minuutin aikarajan. Tarkistin sen jälkeen, että `preview-testi-37` palautti `NotFound` ja päähaaran `project` oli tilassa `Active`. Uusinta-ajo onnistui, kun esikatseluympäristö oli jo poistunut.
