#!/bin/sh
gcc -g -std=gnu99 TCPEchoServer4.c ../socket/DieWithMessage.c ../socket/TCPServerUtility.c ../socket/AddressUtility.c -o TCPEchoServer4
