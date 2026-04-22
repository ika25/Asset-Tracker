import { exec } from 'child_process';

export const scanNetwork = () => {
  return new Promise((resolve, reject) => {
    // Ping scan only (`-sn`) discovers active hosts without doing a port sweep.
    exec('nmap -sn 192.168.1.0/24', (error, stdout) => {
      if (error) return reject(error);

      resolve(stdout);
    });
  });
};