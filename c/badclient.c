#include <stdio.h>
#include <string.h>
#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
int main(args,argv){
    int i,s,fd,len;
    struct sockaddr_in remote_addr;
    int sin_size;
    char buf[BUFSIZ];
    memset(&remote_addr,0,sizeof(remote_addr));
    remote_addr.sin_family=AF_INET;
    remote_addr.sin_addr.s_addr=inet_addr("127.0.0.1");
     unsigned int pp=87654;
    remote_addr.sin_port=htons(pp);
    if((s=socket(AF_INET,SOCK_STREAM,0))<0){
        perror("socket");
        return 1;
    }
    if(connect(s,(struct sockaddr *)&remote_addr,sizeof(struct sockaddr))<0){
        perror("connect");
        return 1;
    }
    printf("connect to server");
    len=recv(s,buf,BUFSIZ,0);
    buf[len]='\0';
    printf("%s",buf);
    len=send(s,"test1 message",13,0);
    len=send(s,"test2 message",13,0);
    len=send(s,"test3 message",13,0);
    len=send(s,"test4 message",13,0);
    len=send(s,"test5 message",13,0);
    close(s);
    return 0;
}

