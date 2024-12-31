import { generateSecretKey, getPublicKey, finalizeEvent, verifyEvent, Relay } from 'nostr-tools';
import WebSocket from 'ws';

// Generate secret and public keys
const secretKey = generateSecretKey();
const publicKey = getPublicKey(secretKey);

console.log('Secret Key:', secretKey);
console.log('Public Key:', publicKey);

// Create and verify an event
const event = finalizeEvent(
    {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'hello',
    },
    secretKey
);

const isEventValid = verifyEvent(event);
console.log('Event is valid:', isEventValid);

// Assign WebSocket implementation for nostr-tools
// @ts-expect-error
global.WebSocket = WebSocket;

// Connect to a Nostr relay
Relay.connect('wss://relay.nostrdice.com').then((relay) => {
    console.log('Connected to relay:', relay.url);

    // Generate new keys for subscription and publishing
    const subscriptionSecretKey = generateSecretKey();
    const subscriptionPublicKey = getPublicKey(subscriptionSecretKey);

    // Subscribe to the relay for events authored by the generated public key
    relay.subscribe(
        [
            {
                kinds: [1], // Kind 1 for text notes
                authors: [subscriptionPublicKey],
            },
        ],
        {
            onevent(event) {
                console.log('Received event:', event);
            },
        }
    );

    // Create and publish a new event
    const newEventTemplate = {
        kind: 1,
        created_at: Math.floor(Date.now() / 1000),
        tags: [],
        content: 'Buongiorno Nostr!',
    };

    const signedEvent = finalizeEvent(newEventTemplate, subscriptionSecretKey);
    relay.publish(signedEvent);
    console.log('Published note:', signedEvent.content);

    // relay.close();
});
