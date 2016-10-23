function Transaction(total){
    this.total = total;
}

Transaction.prototype.make = function(){
    var self = this;
     tetra
            .service({
                service: 'local.transaction.engine',
                namespace: 'ingenico.transaction'
            })
            .reset()
            .connect()
            .call('ManageTransaction', {
                hide: true,
                data: {
                    transaction: {
                        currency: {
                            code: 'EUR',
                            numCode: 978,
                            minorUnit: 2,
                            minorUnitSeparator: ",",
                            thousandSeparator: "",
                            position: "CURRENCY_BEFORE_AMOUNT",
                            symbol: "&euro;"
                        },
                        value: self.total.toString(), //300 =3€           

                        transactionType: "Payment"
                    },
                }
            })
            .success(function (e) {

                self.onsuccess();

            })
            .error(function (e) {

               console.log('ERROR: ' + e.response.transactionDetails);
               self.onerror();

            })
            .disconnect()
}

/** Override this method */
Transaction.prototype.onsuccess = function(){}

/** Override this method */
Transaction.prototype.onerror = function(){}