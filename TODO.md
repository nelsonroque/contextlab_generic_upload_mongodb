# Completed

# In Progress
- add api_key support (or other auth method)
- make API key check against api_key table
- figure out how to use this in place of common_parameters
```
# class QueryParams(BaseModel):
#     skip: int = 0
#     limit: int = 100
```

# On hold
- replace any constants with new version keys
- if admin emails as dependency injection
- sample.env
- write docs from directory structure
- write docs from openapi spec
- tidy up model returns
- standardize commenting syntax
- redo database

- generate user_uid for study_uid (for participants)
- rethink access control
  - types of users: researcher and participant are mainly necessary
- multiple deployments
- Github secret, AWS KMS