#!/bin/bash
rm -rf function.zip
zip -r function.zip .
aws lambda update-function-code --function-name fetchData --zip-file fileb://function.zip
rm -f function.zip
