#!/bin/sh
gcc -o TCPEchoServer -std=gnu99 TCPEchoServer.c DieWithMessage.c TCPServerUtility.c AddressUtility.c
