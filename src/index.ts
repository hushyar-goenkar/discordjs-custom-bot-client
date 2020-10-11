import { Client, Message, ClientOptions, MessageEmbed } from 'discord.js';
import { getCustomPrefix } from './util/get-custom-prefix';

export type onMessageHandler = {
  /*** Msg handler callback*/
  handler: (msg: Message) => void,
  /*** Name of the handler*/
  name: string
}

export interface IDiscordClientOptions extends ClientOptions {
  /** Whether to enable per server custom prefix via nickname. Default false. */
  enableCustomPrefix?: boolean,
  /** Default prefix. Default '!' */
  defaultPrefix?: string
}

export const DiscordClientDefaults = {
  enableCustomPrefix: false,
  defaultPrefix: '!'
}

/**
 * @function getDiscordClient
 * @param client Discord.js client class.
 */
export default function(client: typeof Client) {
  return class DiscordClient extends client {
    onMessageList: onMessageHandler[];
    defaultPrefix: string;
    enableCustomPrefix: boolean;

    constructor(clientOptions?: IDiscordClientOptions) {
      clientOptions = {
        ...DiscordClientDefaults,
        ...clientOptions
      }

      super(clientOptions);
      this.onMessageList = [];

      this.enableCustomPrefix = clientOptions.enableCustomPrefix;
      this.defaultPrefix = clientOptions.defaultPrefix;

      this.on('message', msg  => {
        return this.onMessageList.forEach(onMsgHandler => {
          onMsgHandler.handler(msg);
        })
      })
    }

    /**
     * @description Optimized on message event listener. Uses a single event listener to check for all events.
     * @param msgHandler An object with an even handler on the message event.
     */
    onMsg(msgHandler: onMessageHandler) {
      this.onMessageList.push(msgHandler);
    }

    /**
     * @param handlerName Name of the handler to be deleted.
     */
    offMsg(handlerName: string) {
      this.onMessageList = this.onMessageList.filter(handler => handler.name != handlerName);
    }

    /**
     * @description Set up a command listener.
     * @param client The main discord.js client object.
     * @param command Command as a string (without prefix).
     * @param quickResponse A direct string or embed output to be sent in the same channel. Enter empty string for no quick response.
     * @param cb A callback that is fired when the command is run.
     */
    onCommand(command: string, quickResponse:  (string | MessageEmbed), cb?: (msg: Message, prefix: string) => void) {
      this.onMsg({
        name: command,
        handler: msg => {
          let prefix: string = (this.enableCustomPrefix && (msg.channel.type !== 'dm')) ?
            getCustomPrefix(this.defaultPrefix, msg.guild) :
            this.defaultPrefix;

          if (msg.content.toLowerCase() === `${prefix}${command}`) {
            if (quickResponse !== '') msg.channel.send(quickResponse);
            if (cb) cb(msg, prefix);
          }
        }
      })
    }
  }
}
