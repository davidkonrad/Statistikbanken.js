# 📈 Statistikbanken.js

En lille javascript-funktion som indkapsler Statistikbankens API.

Se https://www.dst.dk/da/Statistik/brug-statistikken/muligheder-i-statistikbanken/api.


**Bemærk**: DST / Statistikbanken har intet at gøre med dette script. DST leverer desværre ingen eksempler eller dokumentation på praktisk brug af deres API, så i forhold til javascript var det lidt *try and error*. Scriptet er så at sige lavet, fordi det manglede 🙃 

### Fordele

* Kom hurtigt i gang - én enkelt fil
* Uniform / ensartet tilgang til DST's API
* Automatisk parsing af JSON og CSV
* Fejlhåndtering 
* Indbygget cache

### Brug

Statistikbanken.js er licenseret under MIT. Enhver kan frit bruge det, forke det, udnytte det kommercielt, modificere det etc. Opret et <a href="https://github.com/davidkonrad/Statistikbanken.js/issues">issue</a> hvis du har fundet en fejl eller synes der er noget som mangler. 

Hent repoet ned :

```sh
git clone https://github.com/davidkonrad/Statistikbanken.js.git
```

```html
<script src="Statistikbanken.js/Statistikbanken.js"></script>
```

En global funktion ```Statistikbanken``` kan herefter kaldes fra den øvrige javascript kode. Eksempler :

```javascript
Statistikbanken.subjects().then(function(result) {
  console.log(result)
})
Statistikbanken.tableInfo('FOLK1C').then(function(result) {
  console.log(result)
})
```
Det giver måske mening at tildele ```Statistikbanken``` et shorthand alias :

```javascript
const SB = Statistikbanken //benytter dette alias fremadrettet
```


### .init()

SB har nogle generelle indstillinger som løbende kan ændres via ```init()``` : 

<table>
<thead>
<tr>
<th>Indstilling</th>
<th>Standard</th>
<th>Muligheder</th>
</tr>
</thead>
<tbody>
<tr>
<td>language</td>
<td>'da'</td>
<td>'da' | 'en'</td>
<tr>
<td>format</td>
<td>'JSON'</td>
<td>'JSON' | 'XML'</td>
<tr>
<td>cache</td>
<td>false</td>
<td>true | false</td>
</tr>
</tbody>
</table>

Eksempler 

```javascript
SB.init({ format: 'XML' })
SB.init({ language: 'en', cache: true })
```
Standardindstillingerne gælder indtil de ændres med ```init()```.

## API

For hver af DST's API-funktioner (se linket herover), findes der i SB en tilsvarende funktion med samme navn: ```subjects```, ```tableInfo```, ```tables``` og ```data```. 

### .subjects()

```subjects()``` leverer oplysninger om Statistikbankens forskellige kategorier (eller *emner*). Disse er hierarkisk ordnet i niveauer. En tom forespørgsel :

```javascript
SB.subjects().then(function(result) {
  console.log(result)
})
```

Returnerer det øverste niveau. Som udgangspunkt i ```JSON```. Mulige parametre :

<table>
<thead>
<tr>
<th>Navn</th>
<th>Betyder</th>
<th>Muligheder</th>
</tr>
</thead>
<tbody>
<tr>
<td>subjects</td>
<td>Liste af emner der skal findes underemner for</td>
<td>[1,2,3]</td>
<tr>
<td>includeTables</td>
<td>Medtag information om emnernes tabeller</td>
<td>true</td>
<tr>
<td>recursive</td>
<td>Om underemner skal fremsøges gennem hele hierarkiet</td>
<td>true</td>
</tr>
<tr>
<td>omitInactiveSubjects</td>
<td>Udelad emneområder som ikke længere bliver opdateret</td>
<td>true</td>
</tr>
<tr>
<td>omitSubjectsWithoutTables</td>
<td>Udelad underemner som har nogen tabeller</td>
<td>true</td>
</tr>

</tbody>
</table>

Eksempel:

```javascript
SB.subjects({
  subjects: [13, 17, 19],
  includeTables: true
}).then(function(result) {
  console.log(result)
})
```

### .tables()
```tables()``` leverer oplysninger om API'ets tabeller (statistikker). En tom forespørgsel returnerer alle aktive tabeller :

```javascript
SB.tables().then(function(result) { })
```
Mulige parametre :
<table>
<thead>
<tr>
<th>Navn</th>
<th>Betyder</th>
<th>Muligheder</th>
</tr>
</thead>
<tbody>
<tr>
<td>subjects</td>
<td>Liste af emner der skal findes tabeller for</td>
<td>[1,2,3]</td>
<tr>
<td>pastdays</td>
<td>Medtag tabeller der er opdateret indenfor *n* dage</td>
<td>47</td>
<tr>
<td>includeInactive</td>
<td>Medtag også inaktive tabeller</td>
<td>true</td>
</tr>
</tbody>
</table>

Eksempler : 

```javascript
SB.tables({ includeInactive: true }).then(function(result) { })

SB.tables({ 
  subjects: [13, 17, 19],
  pastdays: 47
}).then(function(result) { })
```
Hver tabel har et ```id```. Dette id bliver brugt af ```tableInfo``` og ```data()```.

### .tableInfo()

```tableInfo()``` returnerer detaljer om en specifik tabel. Det er beskrivelse, fakta-link, kontaktinformation mv,- og vigtigst af alt: Information om tabellens felter og ```variables```. Det er ```variables``` man skal parse for at vide hvilke mulige forespørgselskriterier ```data()``` accepterer for den pågældende tabel.

Et og kun ét ```table_id``` er *påkrævet*, som nævnt kan de findes via ```tables()```. 

```javascript
SB.tableInfo('FOLK3').then(function(result) { })
SB.tableInfo('SKAT').then(function(result) { })
```

### .data()

Med ```data()``` henter du de egentlige statistikdata. Der skal angives et ```table_id``` (samme som ```tableInfo```) og et JSON object med forespørgselsparametre :

```javascript
SB.tableInfo(table_id, {...}).then(function(result) { })
```

Alle parametre *skal* være gyldige, ellers fejler opslaget hos DST. Med "gyldige" menes, at de nøje skal følge anvisningerne fra ```tableInfo()```'s ```variables```. De fleste tabeller har en unik sammensætning af variabler og virkefelter. For eksempel, nogle statistikker går kun fra 2011 - 2017, og hvis man forespørger uden for dette tidsspand fejler opslaget. Eksempel på forespørgsel, "*Folketal den 1. i kvartalet* ..." :

```javascript
SB.data('FOLK1C', {
  'OMRÅDE': ['000', '185', '791', '787'],
  'KØN': '*',
  'Tid': ['2010k2', '(1)']
}).then(function(result) {
  console.log(result)
})
```
Befolkningsudviklingen i *Hele landet*, *Tårnby*, *Viborg* og *Thisted*; delt op *I alt*, *Mænd* og *Kvinder*; set ift. de to kvartaler *2010k2* og seneste kvartal. Dette giver 12 "serier" der f.eks kan vises som kurvediagram. 

DST insisterer på at levere ```data()``` i CSV-format, her kan man ikke vælge JSON eller XML. En fornuftig politik, eftersom denne type data dårligt kan komprimeres bedre end med CSV, og vi taler om op til 1.000.000 poster per transaktion. JSON / XML ville give et kæmpe overhead. 

En respons fra Statistikbanken kan derfor (forskønnet) se sådan her ud :

```
OMRÅDE;KØN;TID;INDHOLD
Hele landet;I alt;2010K2;5540241
Hele landet;I alt;2023K3;5944145
Hele landet;Mænd;2010K2;2745983
Hele landet;Mænd;2023K3;2955326
...
```
SB parser automatisk resultatet og returnerer et JSON array :

```javascript
[
 {OMRÅDE: 'Hele landet', KØN: 'I alt', TID: '2010K2', INDHOLD: '5540241'},
 {OMRÅDE: 'Hele landet', KØN: 'I alt', TID: '2023K3', INDHOLD: '5944145'},
 {OMRÅDE: 'Hele landet', KØN: 'Mænd', TID: '2010K2', INDHOLD: '2745983'},
 {OMRÅDE: 'Hele landet', KØN: 'Mænd', TID: '2023K3', INDHOLD: '2955326'},
...]
```
 .. Lidt nemmere at arbejde med. Som krølle på halen kan det demonstreres, hvordan ```language``` faktisk gør en forskel. DST har vitterlig internationaliseret deres data,- med ```{ language: 'en' }``` er resultatet for samme forespørgsel :

```javascript
[
 {OMRÅDE: 'All Denmark', KØN: 'Total', TID: '2010Q2', INDHOLD: '5540241'},
 {OMRÅDE: 'All Denmark', KØN: 'Total', TID: '2023Q3', INDHOLD: '5944145'},
 {OMRÅDE: 'All Denmark', KØN: 'Men', TID: '2010Q2', INDHOLD: '2745983'},
 {OMRÅDE: 'All Denmark', KØN: 'Men', TID: '2023Q3', INDHOLD: '2955326'},
...]
```

## Cache

Den indbyggede cache er primitiv men yderst effektiv, hvis man hyppigt frekventerer de samme tabeller. Cachen er baseret på ```localStorage```, så der findes en øvre kvota på 5mb. 

<table>
<thead>
<tr>
<th>API</th>
<th>Betyder</th>
<th>Returnerer</th>
</tr>
</thead>
<tbody>
<tr>
<td>SB.cache.empty()</td>
<td>Tømmer cache</td>
<td></td>
<tr>
<td>SB.cache.hits</td>
<td>Antal opslag i cachen</td>
<td>42</td>
<tr>
<td>SB.cache.bytes</td>
<td>Antal bytes sparet</td>
<td>14247</td>
</tr>
</tbody>
</table>

## Demo

```/demo/index.html``` fungerer som demo eller en slags "playground". 

Hvis du er forvirret efter at have skimmet ovenstående "manual" (det kender jeg godt, det er nemmere bare at se hvordan det gøres), kan du prøve demoen og i koden se præcis hvordan man kalder ```SB```.
