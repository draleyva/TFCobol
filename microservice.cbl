000000 identification division.
000000 program-id. microservice.
000000 environment division.
000000 configuration section.
000000 repository. 
000000    function csv-ecb-rates
000000    function all intrinsic.
000000 input-output section.
000000 file-control.
000000    select file-csv assign to "resources/eurofxref.csv" 
000000    organization is sequential
000000    file status is file-status.
000000 data division.
000000 file section.
000000 fd file-csv.
000000    01 csv-content pic x(1024).
000000 working-storage section.
000000    78 SYSLOG-FACILITY-USER value 8.
000000    78 SYSLOG-SEVERITY-ERRROR value 3.
000000    01 file-status pic x(2).
000000        88 file-exists value "00".
000000    01 dataset external.
000000        05 dataset-ptr usage pointer.
000000 procedure division. 
000000    *> read CSV file into csv-content
000000    open input file-csv.
000000    if not file-exists
000000        display "Error reading file" upon syserr
000000        stop run
000000    end-if. 
000000    perform until exit
000000        read file-csv at end exit perform end-read
000000    end-perform.
000000    close file-csv.
000000    *> convert csv-content to the list of key-value pairs
000000    move csv-ecb-rates(csv-content) to dataset.
000000    *> start HTTP server with http-handler callback
000000    call "receive-tcp" using "localhost", 8000, 0, address of entry "http-handler".
000000 end program microservice.
000000 identification division.
000000 program-id. http-handler.
000000 environment division.
000000 configuration section.
000000 repository. function all intrinsic.
000000 data division.
000000 working-storage section.
000000    78 CRLF value x"0D" & x"0A".
000000    78 HTTP-OK value "200 OK".
000000    78 HTTP-NOT-FOUND value "404 Not Found".
000000    01 dataset external.
000000        05 dataset-ptr usage pointer.
000000    01 exchange-rates based.
000000        05 filer occurs 64 times indexed by idx.
000000            10 rate-currency pic x(3).
000000            10 rate-value pic 9(7)V9(8).
000000    01 request-method pic x(3).
000000        88 http-get value "GET".
000000    01 request-path.
000000        05 filler pic x value "/".
000000        05 get-currency pic x(3).
000000        05 filler pic x value "/".
000000        05 get-amount pic x(32).
000000    01 response.
000000        05 response-header.
000000            10 filler pic x(9) value "HTTP/1.1" & SPACE.
000000            10 response-status pic x(13).
000000            10 filler pic x(2) value CRLF.
000000            10 filler pic x(32) value "Content-Type: application/json" & CRLF.
000000            10 filler pic x(16) value "Content-Length: ".
000000            10 response-content-length pic 9(2).
000000            10 filler pic x(2) value CRLF.
000000            10 filler pic x(2) value CRLF.
000000        05 response-content.
000000            10 filler pic x(11) value '{"amount": '.
000000            10 eur-amount pic z(14)9.9(16).
000000            10 filler pic x(1) value '}'.
000000 linkage section.
000000    01 l-buffer pic x any length.
000000    01 l-length usage binary-int unsigned.
000000 procedure division using l-buffer, l-length returning omitted.
000000    *> initialize exchange rates
000000    set address of exchange-rates to dataset-ptr.
000000    
000000    *> parse request as "GET /<currency>/<amount>"
000000    unstring l-buffer(1:l-length) delimited by all SPACES into 
000000       request-method, request-path.
000000    if not http-get
000000        perform response-NOK
000000    end-if.
000000    *> find currency and calculate eur-amount
000000    perform varying idx from 1 by 1 until idx > 64
000000        if rate-currency(idx) = get-currency
000000            compute eur-amount = numval(get-amount) / rate-value(idx) 
000000                on size error perform response-NOK
000000            end-compute
000000           perform response-OK
000000        end-if
000000    end-perform.
000000    *> or nothing
000000    perform response-NOK.
000000 response-OK section.
000000    move HTTP-OK to response-status.
000000    move byte-length(response-content) to response-content-length.
000000    perform response-any.
000000 response-NOK section.
000000    move HTTP-NOT-FOUND to response-status.
000000    move 0 to response-content-length.
000000    perform response-any.
000000 response-any section.
000000    string response delimited by size into l-buffer.
000000    compute l-length = byte-length(response-header) + response-content-length.
000000    goback.
000000 end program http-handler.
000000 copy "modules/modules.cpy".
