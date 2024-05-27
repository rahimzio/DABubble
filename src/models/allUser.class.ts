export class AllUser{
    name: string;
    eMail: string;
    avatar: any;
    id:any;
    isOnline: any;
    channels: {};


    constructor(obj? : any){
        this.name = obj ? obj.name : '';
        this.eMail = obj ? obj.email : '';
        this.avatar = obj ? obj.avatar : '';
        this.id = obj ? obj.id : '';
        this.isOnline = obj ? obj.isOnline :'';
        this.channels = obj ? obj.channels: {};
    }

    public toJSON() {
        return {
          name: this.name,
          email: this.eMail,
          avatar: this.avatar,
          id: this.id,
          isOnline: this.isOnline,
          channels: this.channels
        };
      }

      
}