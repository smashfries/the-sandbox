#!/bin/bash

cd code && javac $(ls -1 | head -1) && java $(ls -1 | head -1 | cut -d. -f1)

