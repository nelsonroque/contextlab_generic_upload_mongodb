
# class CustomHttpMiddleware(BaseHTTPMiddleware):
#     async def __call__(self, scope: Scope, receive: Receive, send: Send):
#         if scope["type"] != "http":
#             await self.app(scope, receive, send)
#             return
#         self._add_custom_headers(scope=scope)
#         request = Request(scope, receive=receive)
#         response = await self.dispatch_func(request, self.call_next)
#         await response(scope, receive, send)

#     async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
#         return await call_next(request)

#     @classmethod
#     def _add_custom_headers(cls, scope: Scope):
#         scope["headers"].append((b"token", b"my_token"))


# if __name__ == '__main__':
#     app.add_middleware(CustomHttpMiddleware)