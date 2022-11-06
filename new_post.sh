#!/usr/bin/env bash

read -p 'Filename? (like my_new_post.md) > ' file_name

hugo new posts/$file_name
