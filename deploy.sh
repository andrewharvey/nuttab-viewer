#!/bin/sh

rsync --archive --compress --verbose --delete --copy-links --copy-unsafe-links --recursive --files-from dist.txt src root@tianjara:/var/www/nuttab/
