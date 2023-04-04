# contextlab_generic_upload_mongodb
 
db.data.find().sort({'_id':-1}).limit(10).pretty()
db.data.aggregate([{"$group" : {_id:"$study_uid", count:{$sum:1}}} ])
db.studies.aggregate([{"$group" : {_id:"$email", count:{$sum:1}}} ])