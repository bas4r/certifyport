#include <eosio/eosio.hpp>
#include <string>
#include <vector>
using namespace std;
using namespace eosio;

CONTRACT cerify : public eosio::contract
{
public:
	struct signer
	{
		name name;
		bool issigned;
	};

private:
	TABLE certificate
	{
		uint64_t id;
		string certtemplate;
		vector<uint64_t> assignees;
		vector<signer> signers;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"certificate"_n, certificate> certificate_table;

	TABLE corporate
	{
		uint64_t id;
		string name;
		uint64_t create_amount;

		uint64_t primary_key() const { return id; }
	};
	typedef eosio::multi_index<"corporate"_n, corporate> corporate_table;

public:
	using contract::contract;
	cerify(name self, name code, datastream<const char *> ds) : contract(self, code, ds) {}

	ACTION createcorp(uint64_t id, string name, uint64_t create_amount)
	{
		corporate_table _corporate(_self, _self.value);

		auto itr = _corporate.find(id);
		check(itr == _corporate.end(), "Company had been added before.");

		_corporate.emplace(_self, [&](auto &c) {
			c.id = id;
			c.name = name;
			c.create_amount = create_amount;
		});
	}

	ACTION addamount(uint64_t id, uint64_t amount)
	{
		require_auth(_self);

		corporate_table _corporate(_self, _self.value);

		auto itr = _corporate.find(id);
		check(itr != _corporate.end(), "Company has not been found.");
		uint64_t currentAmount = itr->create_amount;

		_corporate.modify(itr, _self, [&](auto &c) {
			c.create_amount = currentAmount + amount;
		});
	}

	ACTION createcert(uint64_t id, uint64_t corporateid, string certtemplate, vector<uint64_t> assignees)
	{
		certificate_table _certificate(_self, corporateid);
		corporate_table _corporate(_self, _self.value);

		auto corp_itr = _corporate.find(corporateid);
		check(corp_itr != _corporate.end(), "Corporate couldn't found.");

		_corporate.modify(corp_itr, _self, [&](auto &co) {
			co.create_amount = corp_itr->create_amount - 1;
		});

		auto itr = _certificate.find(id);
		check(itr == _certificate.end(), "Certificate had been added before.");

		_certificate.emplace(_self, [&](auto &c) {
			c.id = id;
			c.certtemplate = certtemplate;
			c.assignees = assignees;
		});
	}

	ACTION deletecert(uint64_t id, uint64_t corporateid)
	{
		certificate_table _certificate(_self, corporateid);
		corporate_table _corporate(_self, _self.value);

		auto corp_itr = _corporate.find(corporateid);
		check(corp_itr != _corporate.end(), "Corporate couldn't found.");

		_corporate.modify(corp_itr, _self, [&](auto &co) {
			co.create_amount = corp_itr->create_amount + 1;
		});

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "No certificate found.");

		_certificate.erase(itr);
	}

	ACTION addsigner(uint64_t id, uint64_t corporateid, vector<signer> signers)
	{
		certificate_table _certificate(_self, corporateid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> newsign = itr->signers;
		newsign.insert(newsign.end(), signers.begin(), signers.end());

		_certificate.modify(itr, _self, [&](auto &c) {
			c.signers = newsign;
		});
	}

	ACTION signcert(uint64_t id, uint64_t corporateid, name signerr)
	{
		require_auth(signerr);
		certificate_table _certificate(_self, corporateid);

		auto itr = _certificate.find(id);
		check(itr != _certificate.end(), "Certificate does not exist.");
		vector<signer> signersArr = itr->signers;
		for (int i = 0; i < signersArr.size(); i++)
		{
			if (signersArr[i].name == signerr)
			{
				signersArr[i].issigned = 1;
				_certificate.modify(itr, _self, [&](auto &c) {
					c.signers = signersArr;
				});
				break;
			}
		}
	}


};
EOSIO_DISPATCH(cerify, (createcorp)(addamount)(createcert)(deletecert)(addsigner)(signcert))