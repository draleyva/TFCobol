# Trabajo final Cobol

## Contexto

- El programa Qali Warma emplea a un conjunto de empresas a las que entrega un archivo excel con la información de los paquetes de productos que deben ser entregados a los colegios designados.
- El archivo contiene la información del llamado Item y sus códigos modulares así como los alimentos para cada entrega.
- Se prepara un programa en javascript que procesa el archivo excel y obtiene la ubicación geográfica de cada código modular.

## Información

### Archivo Excel

- El formato es similar a la imagen siguiente que se encuentra en este repositorio en la carpeta resources

![Ejemplo Archivo](https://github.com/draleyva/TFCobol/blob/main/resources/qwexcel.png?raw=true)

### Consulta de posición geográfica

- Los códigos modulares (instituciones educativas) tienen información que puede ser consultada mediantes la url [Padrón Web](http://escale.minedu.gob.pe/PadronWeb/info/ce?cod_mod=0237404&anexo=0) En donde el valor del *query string* cod_mod será reemplazado con el valor a consultar

![Ejemplo Página](https://github.com/draleyva/TFCobol/blob/main/resources/padronweb.png?raw=true)

## Solución

#### Herramientas

- Node.js v16.13.1 Para la implementación de la lectura del archivo excel, captura de posición geográfica y reporte de paquetes

- gnucobol (GnuCOBOL) 3.1.2.0 Para la implementación de un servicio rest que recibirá las coordenadas y las almacenará en base de datos

- Postgres Base de datos
