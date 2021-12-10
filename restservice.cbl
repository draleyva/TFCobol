identification division.
program-id. microservice.
...
procedure division.
*> start HTTP server with http-handler callback
  call "receive-tcp" using "localhost", 8000, 0, address of entry "http-handler".
end program microservice.
identification division.
program-id. http-handler.
...
procedure division using l-buffer, l-length returning omitted.
  *> initialize exchange rates
  set address of exchange-rates to dataset-ptr.
  
  *> parse request as "GET /<currency>/<amount>"
  unstring l-buffer(1:l-length) delimited by all SPACES into request-method, request-path.
  if not http-get
    perform response-NOK
  end-if.
  *> find currency and calculate eur-amount
  perform varying idx from 1 by 1 until idx > 64
  if rate-currency(idx) = get-currency
    compute eur-amount = numval(get-amount) / rate-value(idx)
      on size error perform response-NOK
    end-compute
    perform response-OK
  end-if
  end-perform.
  *> or nothing
  perform response-NOK.
response-OK section.
  move HTTP-OK to response-status.
  move byte-length(response-content) to response-content-length.
  perform response-any.
response-NOK section.
  move HTTP-NOT-FOUND to response-status.
  move 0 to response-content-length.
  perform response-any.
response-any section.
  move 1 to l-length.
  string response delimited by size into l-buffer with pointer l-length.
  subtract 1 from l-length.
  goback.
end program http-handler.
copy "modules/modules.cpy".